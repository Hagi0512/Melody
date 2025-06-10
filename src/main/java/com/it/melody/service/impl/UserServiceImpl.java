package com.it.melody.service.impl;

import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.it.melody.mapper.UserMapper;
import com.it.melody.pojo.Login;
import com.it.melody.pojo.PageResult;
import com.it.melody.pojo.Songs;
import com.it.melody.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    UserMapper userMapper;


    @Override
    public PageResult getLikedSongs(int id, int page, int size) {
        PageHelper.startPage(page, size);
        List<Songs> songs = userMapper.getLikedSongsById(id);
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
    public Login login(String username, String password) {
        return userMapper.getUserByNameAndPassword(username, password);
    }

    @Override
    public void register(String username, String password) {
        userMapper.addUser(username, password);
    }

    @Override
    public void addLikedSong(int id, int songId) {
        userMapper.addFavoriteById(id, songId);
    }

    @Override
    public void deleteLikedSong(int id, int songId) {
        userMapper.deleteFavoriteById(id, songId);
    }

    @Override
    public List<Songs> getAllLikedSongs(int id) {
        return userMapper.getAllLikedSongsById(id);
    }

    @Override
    public boolean isLiked(int id, int songId) {
        return userMapper.findLikedSongById(id, songId) != null;
    }
}
