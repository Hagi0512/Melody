package com.it.melody.service.impl;

import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.it.melody.mapper.SongMapper;
import com.it.melody.pojo.PageResult;
import com.it.melody.pojo.Songs;
import com.it.melody.service.SongService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;

@Service
public class SongServiceImpl implements SongService {
    private static final int DEFAULT_BUFFER_SIZE = 8192;

    @Autowired
    SongMapper songMapper;

    //搜索歌曲
    @Override
    public PageResult searchSong(String query, int page, int size) {
        PageHelper.startPage(page, size);
        List<Songs> songs = songMapper.searchSong(query);
        for (Songs song : songs){
            if (song.getCoverImage() != null){
                String base64Image = Base64.getEncoder().encodeToString(song.getCoverImage());
                String imageSrc = "data:image/jpeg;base64," + base64Image;
                song.setCover(imageSrc);
            }
        }
        Page<Songs> p = (Page<Songs>) songs;
        return new PageResult(p.getTotal(), p.getResult());
    }

    @Override
    public String getSongPath(int id) {
        return songMapper.getSongPath(id);
    }

    @Override
    public List<Songs> getSongsByPlaylistId(int id) {
        return songMapper.getSongsByPlaylistId(id);
    }

    @Override
    public void streamSong(String filePath, HttpServletResponse response) {
        try {
            // 校验路径安全性
            validatePath(filePath);

            // 规范化并检查路径有效性
            Path resolvedPath = Paths.get(filePath).toRealPath(LinkOption.NOFOLLOW_LINKS);
            File mediaFile = resolvedPath.toFile();

            // 文件不存在或不是文件
            if (!mediaFile.exists() || !mediaFile.isFile()) {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "File not found");
                return;
            }

            // 检查文件是否为媒体文件（可选）
            if (!isMediaFile(mediaFile)) {
                response.sendError(HttpServletResponse.SC_UNSUPPORTED_MEDIA_TYPE, "Unsupported file type");
                return;
            }

            // 设置响应头
            setResponseHeaders(response, resolvedPath, mediaFile);

            // 流式传输文件
            streamFileContent(response, resolvedPath);

        } catch (Exception e) {
            System.out.println(e);
        }
    }



    // 安全性验证方法
    private void validatePath(String filePath) throws SecurityException {
        if (filePath == null || filePath.isBlank()) {
            throw new SecurityException("Empty file path");
        }

        // 路径安全模式检查
        checkPathPattern(filePath);
    }

    // 检查路径是否包含不安全字符
    private void checkPathPattern(String filePath) throws SecurityException {
        // 禁止路径中包含 ".." 防止目录遍历攻击
        if (filePath.contains("..")) {
            throw new SecurityException("Path contains illegal sequence: '..'");
        }

        // 禁止路径包含特定特殊字符
        if (filePath.matches(".*[<>\"|?*].*")) {
            throw new SecurityException("Path contains illegal characters");
        }

        // 添加更多安全检查逻辑...
    }

    // 设置响应头
    private void setResponseHeaders(HttpServletResponse response, Path filePath, File mediaFile)
            throws IOException {
        // 确定内容类型
        String contentType = determineContentType(filePath);

        // 获取文件名
        String fileName = mediaFile.getName();

        // 设置响应头
        response.setContentType(contentType);
        response.setHeader("Content-Length", String.valueOf(mediaFile.length()));
        response.setHeader("Content-Disposition",
                "inline; filename=\"" + URLEncoder.encode(fileName, StandardCharsets.UTF_8) + "\"");

        // 允许CORS（根据需求调整）
        response.setHeader("Access-Control-Allow-Origin", "*");
    }

    // 确定内容类型
    private String determineContentType(Path filePath) throws IOException {
        // 优先使用系统检测
        String contentType = Files.probeContentType(filePath);
        if (contentType != null) {
            return contentType;
        }

        // 根据文件扩展名判断
        String fileName = filePath.getFileName().toString().toLowerCase();
        if (fileName.endsWith(".mp3")) {
            return "audio/mpeg";
        } else if (fileName.endsWith(".flac")) {
            return "audio/flac";
        } else if (fileName.endsWith(".wav")) {
            return "audio/wav";
        } else if (fileName.endsWith(".mp4")) {
            return "video/mp4";
        } else if (fileName.endsWith(".mkv")) {
            return "video/x-matroska";
        }

        // 默认返回二进制流
        return "application/octet-stream";
    }

    // 检查文件是否为支持的媒体类型（可选增强）
    private boolean isMediaFile(File file) {
        String name = file.getName().toLowerCase();
        return name.endsWith(".mp3") || name.endsWith(".flac") ||
                name.endsWith(".wav") || name.endsWith(".mp4") ||
                name.endsWith(".mkv");
    }

    // 流式传输文件内容
    private void streamFileContent(HttpServletResponse response, Path filePath)
            throws IOException {
        try (InputStream inputStream = Files.newInputStream(filePath);
             OutputStream outputStream = response.getOutputStream()) {

            byte[] buffer = new byte[DEFAULT_BUFFER_SIZE];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
            outputStream.flush();
        }
    }

}
