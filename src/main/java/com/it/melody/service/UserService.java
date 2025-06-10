package com.it.melody.service;

import com.it.melody.pojo.Login;
import com.it.melody.pojo.PageResult;
import com.it.melody.pojo.Songs;

import java.util.List;

public interface UserService {

    PageResult getLikedSongs(int id, int page, int size);

    Login login(String username, String password);

    void register(String username, String password);

    void addLikedSong(int id, int songId);

    void deleteLikedSong(int id, int songId);

    List<Songs> getAllLikedSongs(int id);
}
