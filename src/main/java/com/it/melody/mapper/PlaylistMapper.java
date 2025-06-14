package com.it.melody.mapper;

import com.it.melody.pojo.Playlist;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface PlaylistMapper {
    List<Playlist> getPlaylistById(int id);

    void addSongById(int id, int songId);

    void addPlaylistByUserId(int id, String name, String description);

    void updatePlaylistById(int id, String name, String description);

    Playlist getPlaylistByListId(int id);

    void deletePlaylistById(int id);
}
